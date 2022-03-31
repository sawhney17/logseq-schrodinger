# Logseq Hugo Export Plugin
>If a note isn't  exported, does it really exist?

A utility to export a logseq page into the hugo format

## Instructions
1. Click the three dots in the top right corner
2. Click export to hugo
3. Select download location

## Configuration
1. Go to plugins view
2. Find hugo export plugin
3. Click the gear icon
4. Click open settings
5. Configure the settings here

## Hugo Configuration

The plugin uses YAML for the Hugo [front-matter](https://gohugo.io/content-management/front-matter/). It will convert Logseq page-properties to Hugo front matter.

Logseq *keywords* are lowercase converted to Hugo keywords, and **category** in Logseq is translated to *categories* for use with Hugo. Logseq *link* (`[[like_this]]`) are stripped of `[[` and `]]`.

All other *keywords* are just converted to Hugo *keywords*. 

For now you *must* add **date** with the posts date in the form of "2012-04-06" to your Logseq page-properties.

