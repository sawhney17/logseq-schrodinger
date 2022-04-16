<div id="top"></div>
<!--
*** Thanks for checking out the logseq-starter-plugin. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Don't forget to give the project a star!
*** Thanks again! Now go create something AMAZING! :D
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]


<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/sawhney17/logseq-schrodinger">
    <img src="icon.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">logseq-starter-plugin</h3>

  <p align="center">
    An awesome README template to jumpstart your projects!
    <br />
    <a href="https://github.com/sawhney17/logseq-schrodinger"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/sawhney17/logseq-schrodinger">View Demo</a>
    ·
    <a href="https://github.com/sawhney17/logseq-schrodinger/issues">Report Bug</a>
    ·
    <a href="https://github.com/sawhney17/logseq-schrodinger/issues">Request Feature</a>
  </p>
</div>


<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#configuration">Configuration</a>
      <ul>
        <li><a href="#meta-data">Meta-data</a></li>
        <li><a href="#configuring_hugo">Configuring Hugo</a></li>
      </ul>
    </li>
    <li><a href="#issues">Issues</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>


<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://github.com/sawhney17/logseq-schrodinger/)

[Logseq](https://logseq.com) is a great PKM (personal knowledge management) tool, but keeping your knowledge for yourself only get s you so far. As [Erwin Schrödinger](https://simple.wikipedia.org/wiki/Erwin_Schrödinger) stated:

> If a note is not published, does it really exist? — Erwin Schrödinger

Knowledge is meant to be treasured and expanded, but before all shared. This plugin helps to make that possible, or at least easier.

**Note:** This project is very much a work-in-progress. Please report <a href="#issues">sssues</a> and questions. 

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- GETTING STARTED -->

## Installation

### Preparation

- Click the 3 dots in the righthand corner and go to **Settings**.
- Go to **Advanced** and enable **Plug-in system**.
- Restart the application.
- Click 3 dots and go to Plugins (or `Esc t p`).

### Install plugin from the Marketplace (recommended) 

- Click the `Marketplace` button and then click `Plugins`.
- Find the plugin and click `Install`.

### Install plugin manually

- Download a released version assets from Github.
- Unzip it.
- Click Load unpacked plugin, and select destination directory to the unzipped folder.



<p align="right">(<a href="#top">back to top</a>)</p>



<!-- Configuration -->
## Configuration

- Click the 3 dots in the righthand corner and go to **Settings**.
- Go to **Plugin Settings**.
- Select correct plugin.

[![Configuration screen][configuration-screenshot]](##configuration)

<p align="right">(<a href="#top">back to top</a>)</p>

### Meta-data

The plugin uses YAML for the Hugo [front-matter](https://gohugo.io/content-management/front-matter/). It will convert Logseq page-properties to Hugo front matter.

Logseq *keywords* are lowercase converted to Hugo keywords, and **category** in Logseq is translated to *categories* for use with Hugo. Logseq *links* (`[[like_this]]`) are stripped of `[[` and `]]`.

All other *keywords* are just converted to Hugo *keywords*. 

For now you *must* add **date** with the posts date in the form of "2012-04-06" to your Logseq page-properties.

``markdown
date:: 2012-04-06
``

<h3 id="configuring_hugo">Configuring Hugo</h3>

[Hugo][hugo] does not by default support backlinks. Use a snippet like the following to simulate backlinks. It will parse every page for local links. This snippet should be placed in `~yourhugo/layouts/partials/backlinks.html`.

```html
{{ $re := $.File.BaseFileName }}
{{ $backlinks := slice }}
{{ range .Site.AllPages }}
   {{ if and (findRE $re .RawContent) (not (eq $re .File.BaseFileName)) }}
      {{ $backlinks = $backlinks | append . }}
   {{ end }}
{{ end }}

{{ if gt (len $backlinks) 0 }}
  <aside>
    <h3>Backlinks</h3>
    <div class="backlinks">
      <ul>
       {{ range $backlinks }}
          <li><a href="{{ .RelPermalink }}">{{ .Title }}</a></li>
       {{ end }}
     </ul>
    </div>
  </aside>
{{ else  }}
  <aside>
    <h4>No notes link to this note</h4>
  </aside>
{{ end }}

<aside class="related">
  {{ $related := .Site.RegularPages.Related . | complement $backlinks | first 3 -}}
  {{ with $related -}}
  <h3>slightly related</h3>
  <ul>
  {{ range . -}}
  <li><a href="{{ .RelPermalink }}">{{ .Title }}</a></li>
  {{ end -}}
  </ul>
  {{ end -}}
</aside>
```

<img src="./images/backlinks.png" width="200px">

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- Issues -->
## Issues

See the [open issues](https://github.com/sawhney17/logseq-schrodinger/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- CONTACT -->
## Contact

Aryan Sawhney - [@Aryan Sawhney](https://twitter.com/aryansawhney17) 

Project Link: [https://github.com/sawhney17/logseq-schrodinger](https://github.com/sawhney17/logseq-schrodinger)

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/sawhney17/logseq-schrodinger.svg?style=for-the-badge
[contributors-url]: https://github.com/sawhney17/logseq-schrodinger/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/sawhney17/logseq-schrodinger.svg?style=for-the-badge
[forks-url]: https://github.com/sawhney17/logseq-schrodinger/network/members
[stars-shield]: https://img.shields.io/github/stars/sawhney17/logseq-schrodinger.svg?style=for-the-badge
[stars-url]: https://github.com/sawhney17/logseq-schrodinger/stargazers
[issues-shield]: https://img.shields.io/github/issues/sawhney17/logseq-schrodinger.svg?style=for-the-badge
[issues-url]: https://github.com/sawhney17/logseq-schrodinger/issues
[license-shield]: https://img.shields.io/github/license/sawhney17/logseq-schrodinger.svg?style=for-the-badge
[license-url]: https://github.com/sawhney17/logseq-schrodinger/blob/master/LICENSE.txt
[product-screenshot]: images/screenshot.jpg
[configuration-screenshot]: ./images/configuration.png
[hugo]: https://gohugo.io